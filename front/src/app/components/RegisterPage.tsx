import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Sprout, ArrowLeft } from "lucide-react";
import { registerUser } from "../services/authService";

export function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (formData.password !== formData.confirmPassword) {
      setServerError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);

    try {
      await registerUser({
        username: formData.email,
        password: formData.password,
        nombre: formData.name,
        apellidos: formData.lastname,
      });

      alert("Registro completado con éxito. Ahora puedes iniciar sesión.");
      navigate("/login");

    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
      style={{ backgroundImage: "url('/img/background_image.png')" }}
    >
      <div className="absolute inset-0 bg-white/30 backdrop-blur-md"></div>
      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-sm border-white/40 shadow-xl">
        <CardHeader className="text-center">
          <img src="/pwa-icon.png" alt="Logo" className="w-16 h-16 object-contain mb-4 mx-auto" />
          <CardTitle>Crear Cuenta</CardTitle>
          <CardDescription>Únete a la gestión agrícola inteligente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Apellidos</Label>
                <Input required value={formData.lastname} onChange={e => setFormData({ ...formData, lastname: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Confirmar Contraseña</Label>
              <Input type="password" required value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} />
            </div>

            {serverError && (
              <p className="text-sm text-red-500 font-medium">{serverError}</p>
            )}

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrarse"}
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}