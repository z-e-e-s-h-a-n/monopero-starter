

 interface SegmentParams {
    [key: string]: string;
  }

  type TSearchParams = Record<string, string | string[] | undefined>;

  interface PageProps {
    params: Promise<SegmentParams>;
    searchParams: Promise<TSearchParams>;
   }

  interface LayoutProps extends PageProps {
    children?: React.ReactNode;
  }