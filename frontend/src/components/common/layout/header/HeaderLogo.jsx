import { ShoppingBag } from "lucide-react";

const HeaderLogo = ({ onMovePage }) => {
  return (
    <button
      type="button"
      className="logo"
      onClick={() => onMovePage("/moodfit")}
    >
      <ShoppingBag size={28} />
      <span>MOOD FIT</span>
    </button>
  );
};

export default HeaderLogo;
