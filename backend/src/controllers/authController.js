import { sendError } from "../utils/httpResponse.js";
import {
	validateAuthToken,
	validateLoginInput,
	validateRegisterInput,
} from "../validators/authValidator.js";

const authErrorStatusMap = {
	USER_EXISTS: 409,
	INVALID_CREDENTIALS: 401,
	INVALID_TOKEN: 401,
	USER_NOT_FOUND: 404,
};

const sendServiceError = (res, serviceError) => {
	const statusCode = authErrorStatusMap[serviceError.code] || 400;
	return res.status(statusCode).json({
		success: false,
		message: serviceError.message,
	});
};

export const createAuthController = ({ authService }) => ({
	register: async (req, res) => {
		try {
			const input = validateRegisterInput(req.body);
			const result = await authService.register(input);
			if (!result.ok) {
				return sendServiceError(res, result.error);
			}

			return res.status(201).json({
				success: true,
				message: "Registration successful",
				...result.data,
			});
		} catch (error) {
			return sendError(res, error);
		}
	},

	login: async (req, res) => {
		try {
			const input = validateLoginInput(req.body);
			const result = await authService.login(input);
			if (!result.ok) {
				return sendServiceError(res, result.error);
			}

			return res.status(200).json({
				success: true,
				message: "Login successful",
				...result.data,
			});
		} catch (error) {
			return sendError(res, error);
		}
	},

	me: async (req, res) => {
		try {
			const token = validateAuthToken(req.headers.authorization);
			const result = await authService.getProfile({ token });
			if (!result.ok) {
				return sendServiceError(res, result.error);
			}

			return res.status(200).json({
				success: true,
				...result.data,
			});
		} catch (error) {
			return sendError(res, error);
		}
	},

	logout: async (req, res) => {
		try {
			const token = validateAuthToken(req.headers.authorization);
			const result = await authService.logout({ token });
			if (!result.ok) {
				return sendServiceError(res, result.error);
			}

			return res.status(200).json({
				success: true,
				message: "Logged out successfully",
			});
		} catch (error) {
			return sendError(res, error);
		}
	},
});
