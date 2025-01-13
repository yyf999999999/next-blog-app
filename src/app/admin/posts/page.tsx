"use client";
import { useState, useEffect } from "react";
import type { Post } from "@/app/_types/Post";
import type { Category } from "@/app/_types/Category";
import PostSummary from "@/app/_components/PostSummary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";

type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  categories: { category: Category }[];
};

const Page: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 環境変数から「APIキー」と「エンドポイント」を取得
  const apiBaseEp = process.env.NEXT_PUBLIC_MICROCMS_BASE_EP!;
  const apiKey = process.env.NEXT_PUBLIC_MICROCMS_API_KEY!;
  console.log(apiKey);
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const requestUrl = "/api/posts";
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });

        // レスポンスのステータスコードが200以外の場合 (カテゴリのフェッチに失敗した場合)
        if (!res.ok) {
          setPosts(null);
          throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
        }

        // レスポンスのボディをJSONとして読み取りカテゴリ配列 (State) にセット
        const apiResBody = (await res.json()) as PostApiResponse[];
        setPosts(
          apiResBody.map((body) => ({
            id: body.id,
            title: body.title,
            content: body.content,
            coverImage: { url: "", width: 0, height: 0 },
            createdAt: body.createdAt,
            categories: body.categories.map((c) => ({
              id: c.category.id,
              name: c.category.name,
            })),
          })) as Post[]
        );
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました"
        );
      }
    };
    fetchPosts();
  }, [apiBaseEp, apiKey]);

  if (fetchError) {
    return <div>{fetchError}</div>;
  }

  if (!posts) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  const dtFmt = "YYYY-MM-DD";

  return (
    <main>
      <div className="mb-2 text-2xl font-bold">投稿記事の管理</div>
      <div className="space-y-3">
        {posts.map((post) => {
          const safeHTML = DOMPurify.sanitize(post.content, {
            ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br"],
          });
          return (
            <div className="border border-slate-400 p-3" key={post.id}>
              <div className="flex items-center justify-between">
                <div>{dayjs(post.createdAt).format(dtFmt)}</div>
                <div className="flex space-x-1.5">
                  {post.categories.map((category) => (
                    <div
                      key={category.id}
                      className={twMerge(
                        "rounded-md px-2 py-0.5",
                        "text-xs font-bold",
                        "border border-slate-400 text-slate-500"
                      )}
                    >
                      {category.name}
                    </div>
                  ))}
                </div>
              </div>
              {/* ファイルの先頭で「Linkコンポーネント」のインポートが必要です */}
              <Link href={`/admin/posts/${post.id}`}>
                <div className="mb-1 text-lg font-bold">{post.title}</div>
                <div
                  className="line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: safeHTML }}
                />
              </Link>
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default Page;
