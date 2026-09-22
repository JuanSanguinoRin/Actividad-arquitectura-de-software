workspace "Boleteria" "Sistema de venta y validacion de entradas para eventos masivos - Grupo 5" {

    !identifiers hierarchical

    model {
        comprador = person "Comprador" "Compra una entrada numerada y la usa para ingresar al evento"
        organizador = person "Organizador del evento" "Configura el evento y monitorea las ventas"
        personalPuerta = person "Personal de puerta" "Escanea el QR en el ingreso al evento con un lector Android"
        autoridades = person "Autoridades locales" "Audita el cumplimiento del aforo maximo permitido"

        pasarela = softwareSystem "Pasarela de pagos" "Procesa el cobro con 3-D Secure" {
            tags "External"
        }
        correo = softwareSystem "Proveedor de correo" "Envia el correo con la boleta y su codigo QR" {
            tags "External"
        }

        boleteria = softwareSystem "Boleteria" "Vende entradas numeradas sin duplicados y valida el acceso al evento" {
            api = container "API de Boleteria" "Fila virtual, bloqueo de sillas, cobro y consulta de reportes" "Node.js"
            db = container "Base de datos" "Sillas, ordenes, boletas y tabla de tareas pendientes (outbox)" "PostgreSQL" {
                tags "Database"
            }
            worker = container "Worker interno" "Procesa la tabla outbox: emite el QR, notifica y actualiza ventas/aforo" "Node.js"
            lector = container "Lector de puerta" "Valida el QR contra su copia local, con o sin red, y sincroniza por delta" "Android"
        }

        // Comprador
        comprador -> boleteria.api "Entra a la fila, bloquea silla, paga y consulta su boleta" "HTTPS"

        // Organizador
        organizador -> boleteria.api "Configura el evento y consulta el tablero de ventas" "HTTPS"

        // Personal de puerta
        personalPuerta -> boleteria.lector "Escanea el QR del comprador" "camara"

        // Autoridades locales
        autoridades -> boleteria.api "Solicita informes y certificados de aforo" "HTTPS"

        // Pasarela de pagos (ida y vuelta)
        boleteria.api -> pasarela "Cobra la orden" "HTTPS, sincrono, timeout ~15s"
        pasarela -> boleteria.api "Resultado del pago y token 3-D Secure" "HTTPS, webhook"

        // Dentro de Boleteria
        boleteria.api -> boleteria.db "Bloquea silla, confirma la orden y encola la tarea de emision" "SQL, misma transaccion"
        boleteria.worker -> boleteria.db "Lee tareas pendientes y las marca como procesadas" "SQL, sondeo periodico"
        boleteria.lector -> boleteria.api "Sincroniza el delta de invalidaciones cuando hay red" "HTTPS, pull periodico"

        // Worker hacia afuera
        boleteria.worker -> correo "Envia la boleta con el QR" "SMTP, asincrono"
        boleteria.worker -> comprador "Notifica en la app que la compra fue confirmada" "push, asincrono"
    }

    views {
        systemContext boleteria "Contexto" {
            include *
            autoLayout lr
        }

        container boleteria "Contenedores" {
            include *
            autoLayout lr
        }

        styles {
            element "Element" {
                color #ffffff
                strokeWidth 2
                shape roundedbox
            }
            element "Person" {
                shape person
                background #08507a
                stroke #08507a
            }
            element "Software System" {
                background #0b6e4f
                stroke #0b6e4f
            }
            element "External" {
                background #6b7280
                stroke #6b7280
            }
            element "Container" {
                background #1a8f68
                stroke #1a8f68
            }
            element "Database" {
                shape cylinder
            }
            relationship "Relationship" {
                thickness 2
                color #444444
            }
        }
    }

    configuration {
        scope softwaresystem
    }

}
