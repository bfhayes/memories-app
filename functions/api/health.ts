export const onRequestGet = async (): Promise<Response> => {
  return Response.json({ status: 'ok' });
};
