import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useAsyncAction } from "./useAsyncAction";

export function useAuthForm(
  mode: "login" | "register",
  onRegistered: () => void,
) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const { login, register } = useAuth();
  const action = useAsyncAction();
  const submit = () =>
    action.run(async () => {
      if (!email.trim() || !password)
        throw new Error("Preencha o email e a senha.");
      if (password.length > 128)
        throw new Error("A senha deve ter até 128 caracteres.");
      if (mode === "register") {
        if (!name.trim()) throw new Error("Informe seu nome.");
        if (password.length < 8)
          throw new Error("Use uma senha com pelo menos 8 caracteres.");
        if (password !== confirmation)
          throw new Error("As senhas não coincidem.");
        await register(name, email, password);
        onRegistered();
      } else await login(email, password);
    });
  return {
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    confirmation,
    setConfirmation,
    submit,
    ...action,
  };
}
