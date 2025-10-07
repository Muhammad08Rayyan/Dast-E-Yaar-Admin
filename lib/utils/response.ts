import { NextResponse } from 'next/server';

export function successResponse(data: any, message = 'Success', status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

export function errorResponse(
  message: string,
  status: number = 400,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

