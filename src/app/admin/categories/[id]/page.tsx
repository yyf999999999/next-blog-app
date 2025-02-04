"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Category } from "@/app/_types/Category";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useAuth } from "@/app/_hooks/useAuth";

// カテゴリをフェッチしたときのレスポンスのデータ型
type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// カテゴリの新規作成 (追加) のページ
const Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryNameError, setNewCategoryNameError] = useState("");

  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth(); // トークンの取得

  // カテゴリ配列 (State)。取得中と取得失敗時は null、既存カテゴリが0個なら []
  const [categories, setCategories] = useState<Category[] | null>(null);

  // ウェブAPI (/api/categories) からカテゴリの一覧をフェッチする関数の定義
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
      setFetchErrorMsg(errorMsg);
    } finally {
      // 成功した場合も失敗した場合もローディング状態を解除
      setIsLoading(false);
    }
  };

  // コンポーネントがマウントされたとき (初回レンダリングのとき) に1回だけ実行
  useEffect(() => {
    fetchCategories();
  }, []);

  // カテゴリの名前のバリデーション
  const isValidCategoryName = (name: string): string => {
    if (name.length < 2 || name.length > 16) {
      return "2文字以上16文字以内で入力してください。";
    }
    if (categories && categories.some((c) => c.name === name && c.id !== id)) {
      return "同じ名前のカテゴリが既に存在します。";
    }
    return "";
  };

  // テキストボックスの値が変更されたときにコールされる関数
  const updateNewCategoryName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategoryNameError(isValidCategoryName(e.target.value));
    setNewCategoryName(e.target.value);
  };

  // フォームのボタン (type="submit") がクリックされたときにコールされる関数
  const handleDelete = async () => {
    setIsSubmitting(true);

    // ▼▼ 追加 ウェブAPI (/api/admin/categories) にDELETEリクエストを送信する処理
    try {
      if (!token) {
        window.alert("予期せぬ動作：トークンが取得できません。");
        return;
      }
      const requestUrl = `/api/admin/categories/${id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: token, // ◀ 追加
        },
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
      }

      router.push("/admin/categories");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリのDELETEリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePut = async () => {
    setIsSubmitting(true);

    // ▼▼ 追加 ウェブAPI (/api/admin/categories) にPOSTリクエストを送信する処理
    try {
      if (!token) {
        window.alert("予期せぬ動作：トークンが取得できません。");
        return;
      }
      const requestUrl = `/api/admin/categories/${id}`;
      const res = await fetch(requestUrl, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: token, // ◀ 追加
        },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
      }

      setNewCategoryName("");
      await fetchCategories(); // カテゴリの一覧を再取得
      router.push("/admin/categories");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリのPUTリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!id || !categories?.some((c) => c.id === id)) {
    return (
      <div className="text-red-500">指定されたidのカテゴリは存在しません</div>
    );
  }

  // カテゴリをウェブAPIから取得中の画面
  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  // カテゴリをウェブAPIから取得することに失敗したときの画面
  if (!categories) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  // カテゴリ取得完了後の画面
  return (
    <main>
      <div className="mb-4 text-2xl font-bold">カテゴリの編集・削除</div>

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

      <form
        onSubmit={handleDelete}
        className={twMerge("mb-4 space-y-4", isSubmitting && "opacity-50")}
      >
        <div className="space-y-1">
          <label htmlFor="oldName" className="block font-bold">
            現在のカテゴリの名前
          </label>
          <p id="oldName" className="text-gray-500 text-opacity-50">
            {categories.find((c) => c.id === id)?.name}
          </p>
        </div>
        <div className="space-y-1">
          <label htmlFor="name" className="block font-bold">
            新しいカテゴリの名前
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full rounded-md border-2 px-2 py-1"
            placeholder="新しいカテゴリの名前を記入してください"
            value={newCategoryName}
            onChange={updateNewCategoryName}
            autoComplete="off"
            required
          />
          {newCategoryNameError && (
            <div className="flex items-center space-x-1 text-sm font-bold text-red-500">
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="mr-0.5"
              />
              <div>{newCategoryNameError}</div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-indigo-500 text-white hover:bg-indigo-600",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            onClick={handlePut}
            disabled={
              isSubmitting ||
              newCategoryNameError !== "" ||
              newCategoryName === ""
            }
          >
            カテゴリの名前を変更
          </button>
          <button
            type="button"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-red-500 text-white hover:bg-red-600",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            削除
          </button>
        </div>
      </form>

      <div className="mb-2 text-2xl font-bold">作成されたカテゴリの一覧</div>
      {categories.length === 0 ? (
        <div className="text-gray-500">
          （カテゴリは1個も作成されていません）
        </div>
      ) : (
        <div>
          <div className="mb-2">
            クリックすると各カテゴリの名前編集・削除画面に移動します。
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className={twMerge(
                  "rounded-md px-2 py-0.5",
                  "border border-slate-400 text-slate-500"
                )}
              >
                <Link href={`/admin/categories/${category.id}`}>
                  {category.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
};

export default Page;
