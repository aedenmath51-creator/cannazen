import { useState } from "react";
import { useLocation } from "wouter";

interface Props {
  id: number|string; name:string; category?:string;
  price:number; originalPrice?:number;
  image?:string; imageHover?:string;
  isNew?:boolean; isBestSeller?:boolean;
  onAddToCart?:(id:number|string)=>void;
}

export function ProductCard({
  id,name,category,price,originalPrice,
  image,imageHover,isNew,isBestSeller,onAddToCart,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [, nav] = useLocation();
  const disc = originalPrice ? Math.round((1-price/originalPrice)*100) : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "transparent",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
      }}
    >
      {/* Image */}
      <div onClick={() => nav(`/boutique/${id}`)}
        style={{
          position: "relative",
          aspectRatio: "1",
          overflow: "hidden",
          background: "var(--cz-bg2)",
        }}>
        <img src={image||""} alt={name}
          onError={e=>{(e.target as HTMLImageElement).style.visibility="hidden"}}
          style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
            opacity: hovered && imageHover ? 0 : 1,
            transform: hovered ? "scale(1.04)" : "scale(1)",
            transition: "opacity .4s ease, transform .6s ease",
          }}/>
        {imageHover && (
          <img src={imageHover} alt={name}
            onError={e=>{(e.target as HTMLImageElement).style.visibility="hidden"}}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              opacity: hovered ? 1 : 0,
              transform: hovered ? "scale(1.04)" : "scale(1.08)",
              transition: "opacity .4s ease, transform .6s ease",
            }}/>
        )}
        {!image && !imageHover && (
          <div style={{position:"absolute",inset:0,display:"flex",
            alignItems:"center",justifyContent:"center"}}>
            <svg viewBox="0 0 80 80" width="50" height="50" opacity=".18">
              <ellipse cx="40" cy="40" rx="28" ry="28" fill="none"
                stroke="currentColor" strokeWidth="1.5"/>
              <path d="M40 14 Q54 26 54 40 Q54 56 40 64 Q26 56 26 40 Q26 26 40 14Z"
                fill="currentColor" opacity=".35"/>
              <line x1="40" y1="12" x2="40" y2="68" stroke="currentColor" strokeWidth="1"/>
              <line x1="12" y1="40" x2="68" y2="40" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </div>
        )}

        {/* Badges */}
        <div style={{position:"absolute",top:10,left:10,display:"flex",flexDirection:"column",gap:4}}>
          {disc!==null&&disc>0&&(
            <span style={{
              background:"var(--cz-sale)",color:"#fff",
              fontSize:10,fontFamily:"sans-serif",fontWeight:600,
              padding:"2px 7px",letterSpacing:".08em",
            }}>-{disc}%</span>
          )}
          {isNew&&(
            <span style={{
              background:"var(--cz-new)",color:"#fff",
              fontSize:10,fontFamily:"sans-serif",fontWeight:600,
              padding:"2px 7px",letterSpacing:".08em",
            }}>NOUVEAU</span>
          )}
          {isBestSeller&&(
            <span style={{
              background:"var(--cz-gold)",color:"var(--cz-inv)",
              fontSize:10,fontFamily:"sans-serif",fontWeight:600,
              padding:"2px 7px",letterSpacing:".08em",
            }}>TOP</span>
          )}
        </div>

        {/* Add to cart bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "var(--cz-btn)",
          transform: hovered ? "translateY(0)" : "translateY(100%)",
          transition: "transform .3s cubic-bezier(.4,0,.2,1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "13px",
        }}>
          <button onClick={e=>{e.stopPropagation();onAddToCart?.(id)}}
            style={{
              background: "none", border: "none",
              color: "var(--cz-btntxt)", fontFamily: "sans-serif",
              fontSize: 11, letterSpacing: ".12em", cursor: "pointer", fontWeight: 600,
            }}>
            AJOUTER AU PANIER
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{paddingTop: 12, paddingBottom: 16, borderBottom: "1px solid var(--cz-line)"}}>
        {category && (
          <div style={{
            fontSize: 9, fontFamily: "sans-serif",
            color: "var(--cz-gold)", letterSpacing: ".18em",
            marginBottom: 5, textTransform: "uppercase",
          }}>{category}</div>
        )}
        <div style={{
          fontSize: 14, color: "var(--cz-text)", fontFamily: "serif",
          lineHeight: 1.35, marginBottom: 8,
        }}>{name}</div>
        <div style={{display:"flex",alignItems:"baseline",gap:8}}>
          <span style={{fontSize:15,color:"var(--cz-gold)",fontFamily:"serif"}}>
            {price.toFixed(2).replace(".",",")} €
          </span>
          {originalPrice&&(
            <span style={{fontSize:12,color:"var(--cz-text3)",
              textDecoration:"line-through",fontFamily:"sans-serif"}}>
              {originalPrice.toFixed(2).replace(".",",")} €
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
