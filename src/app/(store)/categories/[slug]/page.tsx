import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryBand } from "@/components/listing/category-band";
import { Listing } from "@/components/listing/listing";
import { BandSkeleton, ListingSkeleton } from "@/components/listing/listing-skeleton";
import { getCategory, listCategories, listProducts } from "@/lib/catalog";
import { listFacts } from "@/lib/catalog/listing";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  return (await listCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return { title: "Not found | MatExpress" };
  return { title: `${category.name} | MatExpress`, description: category.blurb };
}

export default function CategoryPage(props: Props) {
  return (
    <Suspense fallback={<BandSkeleton />}>
      <CategoryContent {...props} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const facts = listFacts(await listProducts(), { categorySlug: slug });

  return (
    <>
      <CategoryBand
        title={category.name}
        blurb={category.blurb}
        image={category.image}
        field={category.field}
        fieldInk={category.fieldInk}
        crumbs={[{ label: "Home", href: "/" }, { label: "All categories", href: "/categories" }, { label: category.name }]}
        facts={facts}
      />
      <Suspense fallback={<ListingSkeleton />}>
        <Listing pathname={`/categories/${slug}`} scope={{ categorySlug: slug }} rawParams={searchParams} />
      </Suspense>
    </>
  );
}
