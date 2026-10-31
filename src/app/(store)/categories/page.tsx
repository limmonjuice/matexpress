import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HomeMotion } from "@/components/home/home-motion";
import { ArrowIcon } from "@/components/home/icons";
import { Breadcrumbs } from "@/components/listing/breadcrumbs";
import { JobDrawing } from "@/components/listing/job-drawing";
import "@/components/listing/listing.css";
import { listCategories, listJobs, listProducts } from "@/lib/catalog";
import { subcategoryHref } from "@/lib/catalog/data/categories";
import { plural } from "@/lib/format";

export const metadata: Metadata = {
  title: "All categories | MatExpress",
  description: "Every kind of construction material from verified hardware stores, by category and by the job on site.",
};

export default async function CategoriesPage() {
  const [categories, jobs, products] = await Promise.all([listCategories(), listJobs(), listProducts()]);

  return (
    <>
      <section className="hm-frame hm-hub-head">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All categories" }]} />
        <h1>What are you building?</h1>
        <p>Start from the job on site, or go straight to the material.</p>
      </section>

      <section className="hm-frame" aria-labelledby="hm-jobs-title">
        <h2 id="hm-jobs-title" className="hm-sr">
          Shop by job
        </h2>
        <ul className="hm-jobs" data-reveal>
          {jobs.map((job) => (
            <li key={job.slug}>
              <Link href={`/jobs/${job.slug}`} className="hm-job">
                <JobDrawing kind={job.drawing} />
                <span className="hm-job-name">
                  {job.name}
                  <ArrowIcon />
                </span>
                <small>{plural(job.products.length, "material")}</small>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="hm-frame hm-section" aria-labelledby="hm-board-title">
        <div className="hm-heading">
          <h2 id="hm-board-title" className="hm-title" data-split>
            Every material
          </h2>
          <Link href="/products" className="hm-link">
            View all products <ArrowIcon />
          </Link>
        </div>
        <ul className="hm-board" data-reveal>
          {categories.map((category) => {
            const count = products.filter((p) => p.categorySlug === category.slug).length;
            return (
              <li key={category.slug} className="hm-board-item">
                <Link href={`/categories/${category.slug}`} className="hm-board-media" tabIndex={-1} aria-hidden="true">
                  <Image src={category.image} alt="" fill sizes="(max-width: 699px) 34vw, 160px" />
                </Link>
                <div className="hm-board-body">
                  <h3>
                    <Link href={`/categories/${category.slug}`}>{category.name}</Link>
                  </h3>
                  <small>{plural(count, "product")}</small>
                  <ul>
                    {category.subcategories.map((name) => (
                      <li key={name}>
                        <Link href={subcategoryHref(category.slug, name)}>{name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <HomeMotion />
    </>
  );
}
