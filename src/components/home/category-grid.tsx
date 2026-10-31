import Image from "next/image";
import Link from "next/link";
import { featuredCategories } from "@/lib/catalog/data/categories";
import { ArrowIcon } from "./icons";
import { SectionHeading } from "./section-heading";

export function CategoryGrid() {
  return (
    <section className="hm-frame hm-section">
      <SectionHeading title="Shop by category" viewAllHref="/categories" viewAllName="categories" />
      <div className="hm-cats" data-reveal>
        {featuredCategories.map((category) => (
          <Link key={category.slug} href={`/categories/${category.slug}`} className="hm-cat">
            <span className="hm-cat-media">
              <Image
                src={category.image}
                alt=""
                fill
                sizes="(max-width: 699px) 46vw, (max-width: 1179px) 23vw, 160px"
              />
            </span>
            <span className="hm-cat-name">
              {category.name}
              <ArrowIcon />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
