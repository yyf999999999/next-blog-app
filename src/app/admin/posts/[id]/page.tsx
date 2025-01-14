"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // ◀ 注目
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Post } from "@/app/_types/Post";
import { Category } from "@/app/_types/Category";

// カテゴリをフェッチしたときのレスポンスのデータ型
type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  coverImageURL: string;
  createdAt: string;
  updatedAt: string;
  categories: { category: Category }[];
};

// 投稿記事のカテゴリ選択用のデータ型
type SelectableCategory = {
  id: string;
  name: string;
  isSelect: boolean;
};

// 投稿記事の編集・削除
const Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCoverImageURL, setNewCoverImageURL] = useState("");

  const router = useRouter();
  const { id } = useParams() as { id: string };

  // カテゴリ配列 (State)。取得中と取得失敗時は null、既存カテゴリが0個なら []
  const [checkableCategories, setCheckableCategories] = useState<
    SelectableCategory[] | null
  >(null);

  // コンポーネントがマウントされたとき (初回レンダリングのとき) に1回だけ実行
  useEffect(() => {
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
          setCheckableCategories(null);
          throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
        }

        // レスポンスのボディをJSONとして読み取りカテゴリ配列 (State) にセット
        const apiResBody = (await res.json()) as CategoryApiResponse[];
        const checkableCat = apiResBody.map((body) => ({
          id: body.id,
          name: body.name,
          isSelect: false,
        }));
        fetchPost(checkableCat);
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
        setIsLoading(false);
      }
    };
    const fetchPost = async (checkableCat: any) => {
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
        //console.log(apiResBody);
        setNewTitle(apiResBody.title);
        setNewContent(apiResBody.content);
        setNewCoverImageURL(apiResBody.coverImageURL);
        checkableCat.map((body: any) => {
          body.isSelect = apiResBody.categories
            .map((c) => c.category.id)
            .includes(body.id);
        });
        setCheckableCategories(checkableCat);
      } catch (e) {
        setFetchErrorMsg(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // チェックボックスの状態 (State) を更新する関数
  const switchCategoryState = (categoryId: string) => {
    if (!checkableCategories) return;

    setCheckableCategories(
      checkableCategories.map((category) =>
        category.id === categoryId
          ? { ...category, isSelect: !category.isSelect }
          : category
      )
    );
  };

  const updateNewTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ここにタイトルのバリデーション処理を追加する
    setNewTitle(e.target.value);
  };

  const updateNewContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // ここに本文のバリデーション処理を追加する
    setNewContent(e.target.value);
  };

  const updateNewCoverImageURL = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ここにカバーイメージURLのバリデーション処理を追加する
    setNewCoverImageURL(e.target.value);
  };

  // フォームの送信処理
  const handlePut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // この処理をしないとページがリロードされるので注意

    setIsSubmitting(true);

    // ▼▼ 追加 ウェブAPI (/api/admin/posts) にPOSTリクエストを送信する処理
    try {
      const requestBody = {
        title: newTitle,
        content: newContent,
        coverImageURL: newCoverImageURL,
        categoryIds: checkableCategories
          ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
          : [],
      };
      const requestUrl = `/api/admin/posts/${id}`;
      console.log(`${requestUrl} => ${JSON.stringify(requestBody, null, 2)}`);
      const res = await fetch(requestUrl, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
      }

      const postResponse = await res.json();
      setIsSubmitting(false);
      router.push(`/posts/${postResponse.id}`); // 投稿記事の詳細ページに移動
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のPOSTリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };
  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // この処理をしないとページがリロードされるので注意

    setIsSubmitting(true);

    // ▼▼ 追加 ウェブAPI (/api/admin/posts) にPOSTリクエストを送信する処理
    try {
      const requestUrl = `/api/admin/posts/${id}`;
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
    router.push("/admin/posts");
  };

  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!checkableCategories) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  return (
    <main>
      <div className="mb-4 text-2xl font-bold">投稿記事の編集・削除</div>

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

      <form className={twMerge("space-y-4", isSubmitting && "opacity-50")}>
        <div className="space-y-1">
          <label htmlFor="title" className="block font-bold">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="w-full rounded-md border-2 px-2 py-1"
            value={newTitle}
            onChange={updateNewTitle}
            placeholder="タイトルを記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block font-bold">
            本文
          </label>
          <textarea
            id="content"
            name="content"
            className="h-48 w-full rounded-md border-2 px-2 py-1"
            value={newContent}
            onChange={updateNewContent}
            placeholder="本文を記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="coverImageURL" className="block font-bold">
            カバーイメージ (URL)
          </label>
          <input
            type="url"
            id="coverImageURL"
            name="coverImageURL"
            className="w-full rounded-md border-2 px-2 py-1"
            value={newCoverImageURL}
            onChange={updateNewCoverImageURL}
            placeholder="カバーイメージのURLを記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="font-bold">タグ</div>
          <div className="flex flex-wrap gap-x-3.5">
            {checkableCategories.length > 0 ? (
              checkableCategories.map((c) => (
                <label key={c.id} className="flex space-x-1">
                  <input
                    id={c.id}
                    type="checkbox"
                    checked={c.isSelect}
                    className="mt-0.5 cursor-pointer"
                    onChange={() => switchCategoryState(c.id)}
                  />
                  <span className="cursor-pointer">{c.name}</span>
                </label>
              ))
            ) : (
              <div>選択可能なカテゴリが存在しません。</div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-indigo-500 text-white hover:bg-indigo-600",
              "disabled:cursor-not-allowed"
            )}
            onClick={handlePut}
            disabled={isSubmitting}
          >
            記事を更新
          </button>
          <button
            type="button"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-red-500 text-white hover:bg-red-600",
              "disabled:cursor-not-allowed"
            )}
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            削除
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;
