import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import {
    Form,
    Link,
    useActionData,
    useSearchParams,
    useTransition,
} from "@remix-run/react";
import { z } from "zod";

// import { Button } from "~/components";
import {
    createAuthSession,
    isAnonymousSession,
    signInWithEmail,
} from "~/modules/auth";
import { response, isFormProcessing } from "~/utils";

export async function loader({ request }: LoaderArgs) {
    try {
        const isAnonymous = await isAnonymousSession(request);

        if (!isAnonymous) {
            return response.redirect("/app", { authSession: null });
        }

        return response.ok({}, { authSession: null });
    } catch (cause) {
        return response.error(cause, { authSession: null });
    }
}

const LoginFormSchema = z.object({
    email: z
        .string()
        .email("invalid-email")
        .transform((email) => email.toLowerCase()),
    password: z.string().min(8, "password-too-short"),
    redirectTo: z.string().optional(),
});

export async function action({ request }: ActionArgs) {
    const formObject = Object.fromEntries(await request.formData());
    const payload = LoginFormSchema.parse(formObject);

    try {
        const { email, password, redirectTo } = payload;

        const authSession = await signInWithEmail(email, password);

        return createAuthSession({
            request,
            authSession,
            redirectTo: redirectTo || "/app",
        });
    } catch (cause) {
        return response.error(cause, { authSession: null });
    }
}

export default function LoginPage() {
    const actionResponse = useActionData<typeof action>();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo") ?? undefined;
    const transition = useTransition();
    const isProcessing = isFormProcessing(transition.state);

    return (
        <div className="flex min-h-full flex-col justify-center">
            <div className="mx-auto w-full max-w-md px-8">
                <Form method="post" className="space-y-6" replace>
                    <h1 className="text-2xl">Login in</h1>
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
                                autoFocus={true}
                                name="email"
                                type="email"
                                autoComplete="email"
                                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                                disabled={isProcessing}
                            />
                            {/* {zo.errors.email()?.message && (
                                <div
                                    className="pt-1 text-red-700"
                                    id="email-error"
                                >
                                    {zo.errors.email()?.message}
                                </div>
                            )} */}
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
                                autoComplete="new-password"
                                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                                disabled={isProcessing}
                            />
                            {/* {zo.errors.password()?.message && (
                                <div
                                    className="pt-1 text-red-700"
                                    id="password-error"
                                >
                                    {zo.errors.password()?.message}
                                </div>
                            )} */}
                        </div>
                    </div>

                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <button className="w-full" disabled={isProcessing}>
                        {isProcessing ? "..." : "Log in"}
                    </button>
                    <div className="flex items-center justify-center">
                        <div className="text-center text-sm text-gray-500">
                            Don't have an account?{" "}
                            <Link
                                className="text-indigo-500 underline"
                                to={{
                                    pathname: "/join",
                                    search: searchParams.toString(),
                                }}
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                    {actionResponse?.error ? (
                        <div className="pt-1 text-red-700" id="name-error">
                            {actionResponse.error.message}
                        </div>
                    ) : null}
                </Form>
            </div>
        </div>
    );
}
