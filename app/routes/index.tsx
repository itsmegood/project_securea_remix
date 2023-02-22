import { Link, Form } from "@remix-run/react";

export default function Index() {
    return (
        <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
            <h1>Welcome to Remix</h1>
            <h2>Sitemap</h2>
            <ul>
                <li>
                    <Link to="auth/user/register">User Register Page</Link>
                </li>
                <li>
                    <Link to="auth/user/login">User Login Page</Link>
                </li>
                <li>
                    <Link to="auth/company/login">Company Login Page</Link>
                </li>
                <Form action="/auth/logout" method="post">
                    <button
                        data-test-id="logout"
                        type="submit"
                        className="inline-block rounded-lg px-3 py-1.5 text-sm font-semibold leading-6 text-gray-900 shadow-sm ring-1 ring-gray-900/10 hover:ring-gray-900/20"
                    >
                        Log out
                    </button>
                </Form>
            </ul>
        </div>
    );
}
