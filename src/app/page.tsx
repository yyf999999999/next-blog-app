"use client";
import { useState, useEffect } from "react";
import type { Post } from "@/app/_types/Post";
import type { Category } from "@/app/_types/Category";
import PostSummary from "@/app/_components/PostSummary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

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
            coverImage: { key: "", width: 0, height: 0 },
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

  return (
    <main>
      <div className="mb-2 text-2xl font-bold">Main</div>
      <div className="space-y-3">
        {posts.map((post) => (
          <PostSummary key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
};

export default Page;
