import type { PlasmoCSConfig } from "plasmo"
import { createRoot } from "react-dom/client"
import EvelynOverlay, { getStyle } from "./overlay"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

// 添加样式
document.head.appendChild(getStyle())

// 创建容器
const container = document.createElement("div")
container.id = "evelyn-overlay-container"
document.body.appendChild(container)

// 渲染组件
const root = createRoot(container)
root.render(<EvelynOverlay />)