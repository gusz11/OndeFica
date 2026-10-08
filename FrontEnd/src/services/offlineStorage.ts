import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { File, Paths } from "expo-file-system";
import { z } from "zod";
import { snapshotSchema, type OfflineStorage } from "./offlineSchema";

const KEY = "ondefica.offline-key";
const options = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const metadataSchema = z.object({
  version: z.literal(1),
  digest: z.string(),
  key: z.string(),
  file: z.string(),
});
// Metadata is validated before it can become a filesystem path.
async function metadata() {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = metadataSchema.safeParse(value);
  if (
    !parsed.success ||
    !/^ondefica-offline-[a-f\d-]+\.bin$/.test(parsed.data.file) ||
    !/^[a-f\d]{64}$/.test(parsed.data.key)
  )
    return null;
  return parsed.data;
}
function discard(name: string) {
  const file = new File(Paths.document, name);
  if (file.exists) file.delete();
}
export const offlineStorage: OfflineStorage = {
  async read(token) {
    try {
      const meta = await metadata();
      if (
        !meta ||
        meta.digest !==
          (await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            token,
          ))
      )
        return null;
      const file = new File(Paths.document, meta.file);
      if (!file.exists || file.size > 4_000_000) return null;
      const key = await Crypto.AESEncryptionKey.import(meta.key, "hex");
      const bytes = await Crypto.aesDecryptAsync(
        Crypto.AESSealedData.fromCombined(await file.bytes()),
        key,
      );
      const parsed = snapshotSchema.safeParse(
        JSON.parse(new TextDecoder().decode(bytes)) as unknown,
      );
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  },
  async write(token, snapshot) {
    const old = await metadata();
    const key = await Crypto.AESEncryptionKey.generate();
    const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
    if (bytes.length > 4_000_000)
      throw new Error("Roteiro grande demais para consulta offline.");
    const sealed = await Crypto.aesEncryptAsync(bytes, key);
    const name = "ondefica-offline-" + Crypto.randomUUID() + ".bin";
    const file = new File(Paths.document, name);
    file.create();
    file.write(await sealed.combined());
    try {
      // Commit the pointer last. A failed write preserves the previous complete snapshot.
      await SecureStore.setItemAsync(
        KEY,
        JSON.stringify({
          version: 1,
          file: name,
          key: await key.encoded("hex"),
          digest: await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            token,
          ),
        }),
        options,
      );
    } catch (error: unknown) {
      discard(name);
      throw error;
    }
    if (old) discard(old.file);
  },
  async clear() {
    const meta = await metadata();
    await SecureStore.deleteItemAsync(KEY);
    if (meta) discard(meta.file);
  },
};
