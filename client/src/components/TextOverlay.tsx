import { cn } from "@/lib/utils";

interface TextOverlayProps {
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  position?: string;
  isVisible?: boolean;
}

export default function TextOverlay({
  text,
  fontFamily = "Amatic SC",
  fontSize = 32,
  fontColor = "#000000",
  position = "bottom-center",
  isVisible = true,
}: TextOverlayProps) {
  if (!isVisible || !text) return null;

  const getPositionStyles = () => {
    switch (position) {
      case "top-left":
        return { top: "10%", left: "10%", textAlign: "left" as const };
      case "top-center":
        return {
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center" as const,
        };
      case "top-right":
        return { top: "10%", right: "10%", textAlign: "right" as const };
      case "center":
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center" as const,
        };
      case "bottom-left":
        return { bottom: "10%", left: "10%", textAlign: "left" as const };
      case "bottom-right":
        return { bottom: "10%", right: "10%", textAlign: "right" as const };
      case "bottom-center":
      default:
        return {
          bottom: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center" as const,
          width: "80%",
        };
    }
  };

  const styles = {
    ...getPositionStyles(),
    fontFamily: `${fontFamily}, cursive, sans-serif`,
    fontSize: `${fontSize}px`,
    color: fontColor,
    textShadow:
      "0px 0px 4px rgba(255, 255, 255, 0.8), 0px 0px 2px rgba(255, 255, 255, 1)",
    lineHeight: "1.4",
  };

  return (
    <div
      className="absolute z-10 pointer-events-none select-none"
      style={styles}>
      <div className="bg-white/30 backdrop-blur-[2px] p-4 rounded-xl border border-white/20 shadow-sm inline-block">
        {text}
      </div>
    </div>
  );
}
