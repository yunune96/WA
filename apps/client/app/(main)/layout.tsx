import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import styles from "@/styles/MainLayout.module.css";

export const metadata = {
  title: "WithoutAlone - 새로운 친구를 만나보세요",
  description: "위치 기반으로 관심사가 비슷한 친구를 찾아보세요.",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.content}>{children}</main>
      <BottomNav />
    </div>
  );
}
