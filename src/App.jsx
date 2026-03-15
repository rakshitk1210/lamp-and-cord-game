import LampGame from "./LampGame";
import SpritesPage from "./SpritesPage";

export default function App() {
  if (window.location.pathname === "/sprites") return <SpritesPage />;
  return <LampGame />;
}
