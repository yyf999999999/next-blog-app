"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // ◀ 注目

import type { Post } from "@/app/_types/Post";
import type { Category } from "@/app/_types/Category";
import dummyPosts from "@/app/_mocks/dummyPosts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import { supabase } from "@/utils/supabase";

import DOMPurify from "isomorphic-dompurify";

type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  coverImageKey: string;
  createdAt: string;
  updatedAt: string;
  categories: { category: Category }[];
};

declare global {
  interface Window {
    copyToClipboard: (preId: string) => void;
  }
}

// 投稿記事の詳細表示 /posts/[id]
const Page: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 動的ルートパラメータから 記事id を取得 （URL:/posts/[id]）
  const { id } = useParams() as { id: string };
  const dtFmt = "YYYY-MM-DD";
  const Bucket = "cover_image";

  // コンポーネントが読み込まれたときに「1回だけ」実行する処理
  useEffect(() => {
    // 本来はウェブAPIを叩いてデータを取得するが、まずはモックデータを使用
    // (ネットからのデータ取得をシミュレートして１秒後にデータをセットする)
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const requestUrl = `/api/posts/${id}`;
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });

        // レスポンスのステータスコードが200以外の場合 (カテゴリのフェッチに失敗した場合)
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
        }

        // レスポンスのボディをJSONとして読み取りカテゴリ配列 (State) にセット
        const apiResBody = (await res.json()) as PostApiResponse;
        console.log(apiResBody);
        setPost({
          id: apiResBody.id,
          title: apiResBody.title,
          content: apiResBody.content,
          coverImage: {
            key: apiResBody.coverImageKey,
            width: 1024,
            height: 1024,
          },
          createdAt: apiResBody.createdAt,
          categories: apiResBody.categories.map((c) => ({
            id: c.category.id,
            name: c.category.name,
          })),
        } as Post);
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  // 投稿データの取得中は「Loading...」を表示
  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  // 投稿データが取得できなかったらエラーメッセージを表示
  if (!post) {
    return <div>指定idの投稿の取得に失敗しました。</div>;
  }

  // HTMLコンテンツのサニタイズ

  window.copyToClipboard = (preId: string) => {
    const preElement = document.getElementById(preId);
    if (preElement) {
      const text = preElement.innerText || preElement.textContent;

      if (text) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            alert("コピーしました！");
          })
          .catch((err) => {
            alert("コピーに失敗しました。");
            console.error(err);
          });
      } else {
        alert("コピーするテキストがありません。");
      }
    }
  };
  let safeHTML = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br", "pre"],
  });
  let programCount = 0;
  safeHTML = safeHTML.replace(/^program-$/gm, () => {
    programCount++;
    return `
  <div class="flex justify-end"><button class="bg-gray-300 rounded-md border border-gray-800 px-1" onclick="copyToClipboard('program-${programCount}')">コピー</button></div>
  <pre id="program-${programCount}" class="bg-black text-white p-4 border border-gray-300 rounded-md">`;
  });
  safeHTML = safeHTML.replace(/^-program$/gm, "</pre>");

  return (
    <main>
      <div className="space-y-2">
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
        <div className="mb-2 text-2xl font-bold">{post.title}</div>
        <div></div>
        <div>
          <Image
            src={
              supabase.storage.from(Bucket).getPublicUrl(post.coverImage.key)
                .data.publicUrl
            }
            alt="Example Image"
            width={post.coverImage.width}
            height={post.coverImage.height}
            priority
            className="rounded-xl"
          />
        </div>
        <div dangerouslySetInnerHTML={{ __html: safeHTML }} />
      </div>
    </main>
  );
};

export default Page;
