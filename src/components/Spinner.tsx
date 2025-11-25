import { useEffect, useState } from "react";

export const Spinner = ({ className }: { className?: string }) => {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 ${className}`}
    ></div>
  );
};

export const FullPageSpinner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
};
