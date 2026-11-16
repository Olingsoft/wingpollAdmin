import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const folder = typeof body.folder === "string" ? body.folder : "wingpoll";

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      "dp5j28dmc";
    const apiKey = process.env.CLOUDINARY_API_KEY || "553857362496798";
    const apiSecret =
      process.env.CLOUDINARY_API_SECRET || "Xis05Oy-PsnA15UrkIeEgl7uCtQ";

    const timestamp = Math.round(Date.now() / 1000);

    // Parameters must be sorted alphabetically for Cloudinary signature
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(`${paramsToSign}${apiSecret}`)
      .digest("hex");

    return Response.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate Cloudinary signature",
      },
      { status: 500 }
    );
  }
}

