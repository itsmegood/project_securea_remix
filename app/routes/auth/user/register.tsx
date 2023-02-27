import * as React from "react";

import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import {
    Form,
    Link,
    useActionData,
    useSearchParams,
    useTransition,
} from "@remix-run/react";
import { z } from "zod";

// import { Button } from "~/components";
import { createAuthSession, isAnonymousSession } from "~/modules/auth";
import { getUserByEmail, createUserAccount } from "~/modules/user";
import { response, isFormProcessing, StackError } from "~/utils";

export async function loader({ request }: LoaderArgs) {
    try {
        const isAnonymous = await isAnonymousSession(request);

        if (!isAnonymous) {
            return response.redirect("/app", { authSession: null });
        }

        return response.ok({}, { authSession: null });
    } catch (cause) {
        throw response.error(cause, { authSession: null });
    }
}

const JoinFormSchema = z.object({
    email: z
        .string()
        .email("invalid-email")
        .transform((email) => email.toLowerCase()),
    password: z.string().min(8, "password-too-short"),
    name: z.string().min(4, "name-too-short"),
    redirectTo: z.string().optional(),
});

export async function action({ request }: ActionArgs) {
    const formObject = Object.fromEntries(await request.formData());

    const payload = JoinFormSchema.parse(formObject);

    try {
        const { email, password, name, redirectTo } = payload;

        const existingUser = await getUserByEmail(email);

        // Email already exists but we return a generic error message
        if (existingUser) {
            // return json({
            //     error: "Something is wrong with credentials.",
            //     authSession: null,
            // });
            throw new StackError({
                message: "Email already registered.",
                status: 403,
                metadata: { email },
            });
        }

        const authSession = await createUserAccount({
            email,
            password,
            name,
        });

        return createAuthSession({
            request,
            authSession,
            redirectTo: redirectTo || "/",
        });
    } catch (cause) {
        // Same with error with this case
        return response.error("Something is wrong with credentials.", {
            authSession: null,
        });
    }
}

export default function Join() {
    const actionResponse = useActionData<typeof action>();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo") ?? undefined;
    const transition = useTransition();
    const isProcessing = isFormProcessing(transition.state);

    return (
        <div className="flex min-h-full flex-col justify-center">
            <div className="mx-auto w-full max-w-md px-8">
                <Form method="post" className="space-y-6" replace>
                    <h1 className="text-2xl">Create an account</h1>

                    <div>
                        <label
                            id="name"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Name
                        </label>
                        <div className="mt-1">
                            <input
                                data-test-id="name"
                                required
                                autoFocus={true}
                                name="name"
                                type="text"
                                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                                disabled={isProcessing}
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Email
                        </label>
                        <div className="mt-1">
                            <input
                                data-test-id="email"
                                required
                                name="email"
                                type="email"
                                autoComplete="email"
                                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                                disabled={isProcessing}
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Password
                        </label>
                        <div className="mt-1">
                            <input
                                data-test-id="password"
                                name="password"
                                type="password"
                                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                                disabled={isProcessing}
                            />
                        </div>
                        {actionResponse?.error.message && (
                            <div
                                className="pt-1 text-red-700"
                                id="password-error"
                            >
                                {actionResponse?.error.message}
                            </div>
                        )}
                    </div>

                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    {/* <Button className="w-full" disabled={isProcessing}>
                        {isProcessing ? "..." : "Create Account"}
                    </Button> */}
                    <button className="w-full" disabled={isProcessing}>
                        {isProcessing ? "..." : "Create Account"}
                    </button>
                    <div className="flex items-center justify-center">
                        <div className="text-center text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link
                                className="text-indigo-500 underline"
                                to={{
                                    pathname: "/auth/user/login",
                                    search: searchParams.toString(),
                                }}
                            >
                            Log In
                            </Link>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
}
