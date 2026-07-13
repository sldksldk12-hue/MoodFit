import { Heart, ShoppingCart } from 'lucide-react';
import '../assets/styles/ProductCard.css';

const ProductCard = ({ product }) => {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={product.image_url} alt={product.product_name} className="product-image" />
        <button type="button" className="heart-button" aria-label="좋아요">
          <Heart size={18} />
        </button>
      </div>

      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <h3>{product.product_name}</h3>
        <p className="product-desc">{product.desc}</p>
        <div className="product-bottom">
          <strong>{product.price.toLocaleString()}원</strong>
          <button type="button" className="cart-mini">
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
