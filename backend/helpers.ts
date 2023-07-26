import * as hapi from '@hapi/hapi';

export async function respondAfterDbUpdate(
  h: hapi.ResponseToolkit,
  rows: any[]
): Promise<hapi.ResponseObject> {
  if (!rows[0]?.id) {
    return h
      .response(
        `Resource has changed since the page was loaded. Please reload and try again.`
      )
      .code(409);
  }

  return h.response('Updated successfully.').code(204);
}
