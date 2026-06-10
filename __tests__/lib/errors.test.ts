import { AppError, handleRouteError, isAppError } from "@/lib/errors";

describe("handleRouteError", () => {
  it("AppError giữ nguyên code, message và httpStatus", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const res = handleRouteError(
      new AppError("PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại", 404)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({
      code: "PRODUCT_NOT_FOUND",
      message: "Sản phẩm không tồn tại",
    });
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("lỗi lạ trả 500 generic và log đầy đủ", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const err = new Error("connection refused");

    const res = handleRouteError(err);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ code: "INTERNAL_ERROR", message: "Server error" });
    expect(consoleSpy).toHaveBeenCalledWith("[api] unhandled error", err);
    consoleSpy.mockRestore();
  });
});

describe("isAppError", () => {
  it("phân biệt AppError với Error thường", () => {
    expect(isAppError(new AppError("VALIDATION_ERROR", "x", 400))).toBe(true);
    expect(isAppError(new Error("x"))).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});
