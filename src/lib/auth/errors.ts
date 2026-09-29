export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export class CustomError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public status: string = "error",
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  static badRequest(message: string) {
    return new CustomError(message, 400, "fail");
  }

  static unauthorized(message: string) {
    return new CustomError(message, 401, "fail");
  }

  static forbidden(message: string) {
    return new CustomError(message, 403, "fail");
  }

  static notFound(message: string) {
    return new CustomError(message, 404, "fail");
  }

  static internal(message: string) {
    return new CustomError(message, 500, "error", false);
  }
}

export const errorHandler = (err: AppError): { statusCode: number; status: string; message: string } => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    return {
      statusCode,
      status,
      message: err.message,
    };
  } else {
    if (err.isOperational) {
      return { statusCode, status, message: err.message };
    } else {
      console.error("ERROR:", err);
      return {
        statusCode: 500,
        status: "error",
        message: "Something went wrong",
      };
    }
  }
};

export const catchAsync = (fn: Function) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error;
    }
  };
};