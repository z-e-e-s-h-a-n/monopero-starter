import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

function Layout({ children }: LayoutProps) {
  return (
    <div id="root">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
