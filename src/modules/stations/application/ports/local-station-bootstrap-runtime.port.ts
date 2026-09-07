export const LOCAL_STATION_BOOTSTRAP_RUNTIME = Symbol(
  'srtaller.stations.local-station-bootstrap-runtime',
);

/** Stations-owned local bootstrap transport; never an enrollment API. */
export interface LocalStationBootstrapRuntime {
  allowsRequest(input: Readonly<{
    origin?: string | undefined;
    host?: string | undefined;
    fetchSite?: string | undefined;
  }>): boolean;
  stationCookie(): string;
}
