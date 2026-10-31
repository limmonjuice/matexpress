import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/listing/breadcrumbs";
import { JobDrawing } from "@/components/listing/job-drawing";
import { Listing } from "@/components/listing/listing";
import { BandSkeleton, ListingSkeleton } from "@/components/listing/listing-skeleton";
import "@/components/listing/listing.css";
import { getJob, listJobs, listProducts } from "@/lib/catalog";
import { listFacts } from "@/lib/catalog/listing";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  return (await listJobs()).map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const job = await getJob((await params).slug);
  if (!job) return { title: "Not found | MatExpress" };
  return { title: `${job.name} | MatExpress`, description: job.blurb };
}

export default function JobPage(props: Props) {
  return (
    <Suspense fallback={<BandSkeleton />}>
      <JobContent {...props} />
    </Suspense>
  );
}

async function JobContent({ params, searchParams }: Props) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const facts = listFacts(await listProducts(), { slugs: job.products });

  return (
    <>
      <section className="hm-frame hm-band-wrap">
        <div className="hm-band hm-band--job" data-ink="light" style={{ "--hm-field": "#131925" } as React.CSSProperties}>
          <div className="hm-band-copy">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All categories", href: "/categories" }, { label: job.name }]} />
            <h1>{job.name}</h1>
            <p className="hm-band-blurb">{job.blurb}</p>
            <ul className="hm-band-facts">
              {facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </div>
          <div className="hm-band-sketch" aria-hidden="true">
            <JobDrawing kind={job.drawing} />
          </div>
        </div>
      </section>
      <Suspense fallback={<ListingSkeleton />}>
        <Listing pathname={`/jobs/${slug}`} scope={{ slugs: job.products }} rawParams={searchParams} defaultSort="relevance" extraSorts={["relevance"]} />
      </Suspense>
    </>
  );
}
