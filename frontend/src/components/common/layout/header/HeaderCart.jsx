import { ShoppingCart } from "lucide-react";

const HeaderCart = ({ cartCount, onMovePage }) => {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={`장바구니 ${cartCount}개`}
      onClick={() => onMovePage("/moodfit/cart")}
    >
      <ShoppingCart size={21} />

      {cartCount > 0 && (
        <span className="cart-count">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </button>
  );
};

export default HeaderCart;
