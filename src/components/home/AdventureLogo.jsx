import { APP_IMAGES } from "../../data/appAssets.js";

export default function AdventureLogo() {
  return <span className="adventure-logo" aria-hidden="true"><img src={APP_IMAGES.logo} alt="" /></span>;
}
