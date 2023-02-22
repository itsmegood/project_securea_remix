import type { AuthSession } from "~/modules/auth";
import {
    createEmailAuthAccount,
    signInWithEmail,
    deleteAuthAccount,
} from "~/modules/auth";

import { db } from "~/database";

import type { User } from "./types";
import { deleteAuthAccountByEmail } from "../auth/service.server";
import { StackError } from "~/utils";

const tag = "User service 🧑";

type UserCreatePayload = Pick<AuthSession, "userId" | "email"> &
    Pick<User, "name">;

export async function getUserByEmail(email: User["email"]) {
    try {
        const user = await db.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        return user;
    } catch (cause) {
        throw new StackError({
            cause,
            message: "Unable to get user by email",
            status: 404,
            metadata: { email },
            tag,
        });
    }
}

async function createUser({ email, userId, name }: UserCreatePayload) {
    try {
        const user = await db.user.create({
            data: {
                email,
                id: userId,
                name,
            },
        });

        return user;
    } catch (cause) {
        throw new StackError({
            cause,
            message: "Unable to create user in database or stripe",
            metadata: { email, userId, name },
            tag,
        });
    }
}

export async function createUserAccount(payload: {
    email: string;
    password: string;
    name: string;
}) {
    const { email, password, name } = payload;

    try {
        const { id: userId } = await createEmailAuthAccount(email, password);
        const authSession = await signInWithEmail(email, password);

        await createUser({
            email,
            userId,
            name,
        });

        return authSession;
    } catch (cause) {
        // We should delete the user account to allow retry create account again
        // We mostly trust that it will be deleted.
        // If it's not the case, the user will face on a "user already exists" kind of error.
        // It'll require manual intervention to remove the account in Supabase Auth dashboard.
        await deleteAuthAccountByEmail(email);

        throw new StackError({
            cause,
            message: "Unable to create user account",
            metadata: { email, name },
            tag,
        });
    }
}

export async function deleteUser(id: User["id"]) {
    try {
        await deleteAuthAccount(id);
        await db.user.delete({ where: { id } });

        return { success: true };
    } catch (cause) {
        throw new StackError({
            cause,
            message: "Oups, unable to delete your test account",
            metadata: { id },
            tag,
        });
    }
}
