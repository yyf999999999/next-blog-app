"use client";
import { useState, useEffect } from "react";
import type { Post } from "@/app/_types/Post";
import type { Category } from "@/app/_types/Category";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 環境変数から「APIキー」と「エンドポイント」を取得
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
  }, []);

  const handleDelete = async (
    e: React.MouseEvent<HTMLButtonElement>,
    post: Post
  ) => {
    e.preventDefault(); // この処理をしないとページがリロードされるので注意

    setIsSubmitting(true);

    // ▼▼ 追加 ウェブAPI (/api/admin/posts) にPOSTリクエストを送信する処理
    try {
      const requestUrl = `/api/admin/posts/${post.id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
      }

      const postResponse = await res.json();
      setIsSubmitting(false);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のPOSTリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
    window.location.reload();
  };

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
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 animate-spin text-gray-500"
            />
            <div className="flex items-center text-gray-500">処理中...</div>
          </div>
        </div>
      )}

      <div className="mb-2">
        <div className="text-2xl font-bold">投稿記事の管理</div>
      </div>
      <Link href={`/admin/posts/new`} className="mb-2 flex justify-end">
        <button
          type="button"
          className={twMerge(
            "rounded-md px-5 py-1 font-bold",
            "bg-blue-500 text-white hover:bg-blue-600",
            "disabled:cursor-not-allowed"
          )}
        >
          新規作成
        </button>
      </Link>
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
              <div className="mb-1 text-lg font-bold">{post.title}</div>
              <div
                className="line-clamp-3"
                dangerouslySetInnerHTML={{ __html: safeHTML }}
              />
              <div className="flex justify-end space-x-2">
                <Link href={`/admin/posts/${post.id}`}>
                  <button
                    type="button"
                    className={twMerge(
                      "rounded-md px-5 py-1 font-bold",
                      "bg-indigo-500 text-white hover:bg-indigo-600",
                      "disabled:cursor-not-allowed"
                    )}
                  >
                    編集
                  </button>
                </Link>
                <button
                  type="button"
                  className={twMerge(
                    "rounded-md px-5 py-1 font-bold",
                    "bg-red-500 text-white hover:bg-red-600",
                    "disabled:cursor-not-allowed"
                  )}
                  onClick={(e) => {
                    handleDelete(e, post);
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default Page;
