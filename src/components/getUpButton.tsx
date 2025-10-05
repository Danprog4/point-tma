import { ArrowUp } from "lucide-react";
import React, { useEffect, useState } from "react";

const GetUpButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Scroll to top"
      className={`fixed right-4 bottom-24 z-[10000] flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-opacity duration-200 ${
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <ArrowUp className="h-6 w-6 text-black" />
    </button>
  );
};

export default GetUpButton;
