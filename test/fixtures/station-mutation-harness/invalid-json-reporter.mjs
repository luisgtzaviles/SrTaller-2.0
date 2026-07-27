export default async function* invalidJsonReporter(source) {
  for await (const _event of source) {
    // Consume the complete official event stream before corrupting its format.
  }
  yield '{"format":"not-complete"';
}
