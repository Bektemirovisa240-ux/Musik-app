/* SDKs loaded at runtime from the providers' CDNs. */
interface Window {
  Spotify: any;
  onSpotifyWebPlaybackSDKReady?: () => void;
  YT: any;
  onYouTubeIframeAPIReady?: () => void;
  google: any;
  SC: any;
  MusicKit: any;
}
