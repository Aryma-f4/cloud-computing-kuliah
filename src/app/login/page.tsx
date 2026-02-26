"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getItem, setItem, keys } from "@/src/lib/storage";
import toast from "react-hot-toast";
import { generateDeviceIdSync } from "@/src/lib/fingerprint";

export default function Login() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [deviceId] = useState(() => generateDeviceIdSync());

  useEffect(() => {
    const u = getItem(keys.user_id);
    const d = getItem(keys.device_id);
    if (u && d) router.replace("/");
  }, [router]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const u = userId.trim();
    if (!u) {
      toast.error("User ID wajib diisi");
      return;
    }
    setItem(keys.user_id, u);
    setItem(keys.device_id, deviceId);
    router.push("/");
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-dvh flex items-center justify-center">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto w-full max-w-md lg:py-0">
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white text-center">
              Aplikasi Presensi QR
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={handleSave}>
              <div>
                <label
                  htmlFor="userId"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  NIM / User ID
                </label>
                <input
                  type="text"
                  name="userId"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Masukkan NIM Anda"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="deviceId"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Device ID (Otomatis)
                </label>
                <input
                  type="text"
                  name="deviceId"
                  id="deviceId"
                  value={deviceId}
                  className="bg-gray-200 border border-gray-300 text-gray-500 rounded-lg cursor-not-allowed block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                  readOnly
                  disabled
                />
              </div>

              <button
                type="submit"
                className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 transition-colors"
              >
                Simpan & Mulai
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
