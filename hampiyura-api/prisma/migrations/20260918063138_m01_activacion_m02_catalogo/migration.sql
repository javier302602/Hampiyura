-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('Visitante', 'UsuarioRegistrado', 'PortadorConocimiento', 'EspecialistaAgronomo', 'EspecialistaConservacion', 'EspecialistaSalud', 'Productor', 'Administrador');

-- CreateEnum
CREATE TYPE "EstadoValidacion" AS ENUM ('Pendiente', 'EnRevision', 'Validado', 'Observado', 'Rechazado');

-- CreateEnum
CREATE TYPE "EstadoCuenta" AS ENUM ('PendienteActivacion', 'Activo');

-- CreateEnum
CREATE TYPE "TipoTokenAccion" AS ENUM ('Activacion', 'RecuperacionContrasena');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contraseñaHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "idioma" TEXT NOT NULL,
    "nivelConocimiento" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "estado" "EstadoCuenta" NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenAccion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoTokenAccion" NOT NULL,
    "token" TEXT NOT NULL,
    "expiracion" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TokenAccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planta" (
    "id" TEXT NOT NULL,
    "nombreComun" TEXT NOT NULL,
    "nombreCientifico" TEXT NOT NULL,
    "familia" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "habitat" TEXT NOT NULL,
    "imagenPrincipal" TEXT,

    CONSTRAINT "Planta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cultivo" (
    "id" TEXT NOT NULL,
    "plantaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "zonaCultivo" TEXT NOT NULL,
    "condicionesClimaticas" TEXT NOT NULL,
    "tipoSuelo" TEXT NOT NULL,
    "altitudAprox" TEXT NOT NULL,
    "aguaNecesaria" TEXT NOT NULL,
    "exposicionSolar" TEXT NOT NULL,
    "epocaSiembra" TEXT NOT NULL,
    "metodoPropagacion" TEXT NOT NULL,
    "tiempoCrecimiento" TEXT NOT NULL,
    "cuidados" TEXT NOT NULL,
    "plagasComunes" TEXT NOT NULL,
    "epocaCosecha" TEXT NOT NULL,
    "recomendacionesSobreexplotacion" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "estadoValidacion" "EstadoValidacion" NOT NULL,

    CONSTRAINT "Cultivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParteUso" (
    "id" TEXT NOT NULL,
    "plantaId" TEXT NOT NULL,
    "parte" TEXT NOT NULL,
    "usoDescrito" TEXT NOT NULL,
    "enfermedadesTratadas" TEXT NOT NULL,
    "contraindicaciones" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "estadoValidacion" "EstadoValidacion" NOT NULL,

    CONSTRAINT "ParteUso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preparacion" (
    "id" TEXT NOT NULL,
    "ingredientes" TEXT NOT NULL,
    "pasos" TEXT NOT NULL,
    "herramientas" TEXT NOT NULL,
    "tiempoPreparacion" TEXT NOT NULL,
    "formaConservacion" TEXT NOT NULL,
    "advertencias" TEXT NOT NULL,
    "contraindicaciones" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estadoValidacion" "EstadoValidacion" NOT NULL,

    CONSTRAINT "Preparacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publicacion" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "imagenes" TEXT[],
    "videos" TEXT[],
    "fechaPublicacion" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL,

    CONSTRAINT "Publicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Valoracion" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "estrellas" INTEGER NOT NULL,

    CONSTRAINT "Valoracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consulta" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "tareaAsignada" TEXT,

    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensajeConsulta" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MensajeConsulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidacionContenido" (
    "id" TEXT NOT NULL,
    "tipoEntidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "estado" "EstadoValidacion" NOT NULL,
    "comentarioValidador" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "ValidacionContenido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reporte" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" TEXT NOT NULL,

    CONSTRAINT "Reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstadoConservacion" (
    "id" TEXT NOT NULL,
    "plantaId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "amenazas" TEXT NOT NULL,
    "tipoConocimiento" TEXT NOT NULL,
    "nivelRiesgo" TEXT NOT NULL,
    "fuenteOficial" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstadoConservacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccionConservacion" (
    "id" TEXT NOT NULL,
    "estadoConservacionId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "responsable" TEXT NOT NULL,
    "evidencias" TEXT NOT NULL,
    "estadoSeguimiento" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccionConservacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "productorId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "ingredientes" TEXT NOT NULL,
    "precioReferencial" TEXT NOT NULL,
    "contactoVendedor" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "etiquetaRevisado" BOOLEAN NOT NULL,
    "etiquetaValidadoDocumental" BOOLEAN NOT NULL,
    "etiquetaCertificado" BOOLEAN NOT NULL,
    "estado" TEXT NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "TokenAccion_token_key" ON "TokenAccion"("token");

-- AddForeignKey
ALTER TABLE "TokenAccion" ADD CONSTRAINT "TokenAccion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cultivo" ADD CONSTRAINT "Cultivo_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cultivo" ADD CONSTRAINT "Cultivo_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParteUso" ADD CONSTRAINT "ParteUso_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajeConsulta" ADD CONSTRAINT "MensajeConsulta_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidacionContenido" ADD CONSTRAINT "ValidacionContenido_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
