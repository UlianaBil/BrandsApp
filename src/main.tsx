import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
// styles.css is imported by tailwind.css into the `legacy` layer — see
// the comment there. Importing it here as well would reintroduce it unlayered.
import "./tailwind.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
