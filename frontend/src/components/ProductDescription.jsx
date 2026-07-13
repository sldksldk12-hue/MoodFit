import "../assets/styles/ProductDescription.css";

const ProductDescription = ({ product }) => {
  return (
    <section className="product-description">


      {/* 대표 설명 */}
      <div className="description-header">
        <h2>{product.product_name}</h2>

        <p className="description-text">
          {product.product_description}
        </p>
      </div>

      {/* 상품 이미지 */}
      <div className="description-images">

        {product.detail_images?.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={product.product_name}
          />
        ))}

      </div>

      {/* 상품 정보 */}
      <div className="product-info-table">

        <table>

          <tbody>

            <tr>
              <th>브랜드</th>
              <td>{product.brand}</td>
            </tr>

            <tr>
              <th>카테고리</th>
              <td>{product.category}</td>
            </tr>

            <tr>
              <th>소재</th>
              <td>{product.material}</td>
            </tr>

            <tr>
              <th>핏</th>
              <td>{product.fit}</td>
            </tr>

            <tr>
              <th>계절</th>
              <td>{product.season}</td>
            </tr>

            <tr>
              <th>제조국</th>
              <td>{product.country}</td>
            </tr>

          </tbody>

        </table>

      </div>

    </section>
  );
};

export default ProductDescription;