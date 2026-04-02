import { apiRequest } from "@/config/api";

export type UserAddress = {
	street: string;
	city: string;
	state: string;
	country: string;
	zipCode: string;
	isDefault?: boolean;
};

export type AuthUser = {
	_id: string;
	fullname?: string;
	email?: string;
	phone?: string;
	role?: string;
	address?: UserAddress[];
};

export type CurrentUser = {
	_id: string;
	fullname?: string;
	email?: string;
	phone?: string;
	role?: string;
	address?: UserAddress[];
};

export type RegisterInput = {
	fullname: string;
	email?: string;
	phone?: string;
	password: string;
};

export type LoginInput = {
	email?: string;
	phone?: string;
	password: string;
};

export type LoginResponse = {
	user: AuthUser;
	accessToken: string;
	refreshToken: string;
};

export type UpdateAccountInput = {
	fullname?: string;
	email?: string;
	phone?: string;
	address?: UserAddress[];
};

export type ChangePasswordInput = {
	oldPassword: string;
	newPassword: string;
};

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
	return apiRequest<AuthUser>("/users/register", {
		method: "POST",
		body: input,
	});
}

export async function loginUser(input: LoginInput): Promise<LoginResponse> {
	return apiRequest<LoginResponse>("/users/login", {
		method: "POST",
		body: input,
	});
}

export async function logoutUser(): Promise<void> {
	await apiRequest<unknown>("/users/logout", {
		method: "POST",
	});
}

export async function getCurrentUser(): Promise<CurrentUser> {
	return apiRequest<CurrentUser>("/users/me");
}

export async function updateAccountDetails(
	input: UpdateAccountInput
): Promise<CurrentUser> {
	return apiRequest<CurrentUser>("/users/update-account", {
		method: "PATCH",
		body: input,
	});
}

export async function changeCurrentUserPassword(
	input: ChangePasswordInput
): Promise<void> {
	await apiRequest<unknown>("/users/change-password", {
		method: "POST",
		body: input,
	});
}