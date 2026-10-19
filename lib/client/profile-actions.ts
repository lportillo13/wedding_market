type SaveFeedback = { ok: boolean; message: string };

/** Keep a transport failure inside the form so an error boundary cannot discard its draft. */
export async function runProfileAction<State extends SaveFeedback>(
  action: (previous: State, data: FormData) => Promise<State>,
  previous: State,
  data: FormData,
  failureMessage: string,
): Promise<State> {
  try {
    return await action(previous, data);
  } catch {
    return { ...previous, ok: false, message: failureMessage };
  }
}
