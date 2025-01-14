"use client";
import { useState, useEffect } from "react";
import type { Category } from "@/app/_types/Category";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";

type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

const Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 環境変数から「APIキー」と「エンドポイント」を取得
  const apiBaseEp = process.env.NEXT_PUBLIC_MICROCMS_BASE_EP!;
  const apiKey = process.env.NEXT_PUBLIC_MICROCMS_API_KEY!;
  console.log(apiKey);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);

        // フェッチ処理の本体
        const requestUrl = "/api/categories";
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });

        // レスポンスのステータスコードが200以外の場合 (カテゴリのフェッチに失敗した場合)
        if (!res.ok) {
          setCategories(null);
          throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
        }

        // レスポンスのボディをJSONとして読み取りカテゴリ配列 (State) にセット
        const apiResBody = (await res.json()) as CategoryApiResponse[];
        setCategories(
          apiResBody.map((body) => ({
            id: body.id,
            name: body.name,
          }))
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchError(errorMsg);
      } finally {
        // 成功した場合も失敗した場合もローディング状態を解除
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [apiBaseEp, apiKey]);

  const handleDelete = async (
    e: React.MouseEvent<HTMLButtonElement>,
    category: Category
  ) => {
    e.preventDefault(); // この処理をしないとページがリロードされるので注意

    setIsSubmitting(true);

    // ▼▼ 追加 ウェブAPI (/api/admin/posts) にPOSTリクエストを送信する処理
    try {
      const requestUrl = `/api/admin/categories/${category.id}`;
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

  if (!categories) {
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
        <div className="text-2xl font-bold">カテゴリの管理</div>
      </div>
      <Link href={`/admin/categories/new`} className="mb-2 flex justify-end">
        <button
          type="button"
          className={twMerge(
            "rounded-md px-5 py-1 font-bold",
            "bg-blue-500 text-white hover:bg-blue-600",
            "disabled:cursor-not-allowed"
          )}
        >
          カテゴリの新規作成
        </button>
      </Link>
      <div className="space-y-3">
        {categories.map((category) => {
          return (
            <div
              className="flex justify-between border border-slate-400 p-3"
              key={category.id}
            >
              <div className="mb-1 text-lg font-bold">{category.name}</div>
              <div className="flex justify-end space-x-2">
                <Link href={`/admin/categories/${category.id}`}>
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
                    handleDelete(e, category);
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
