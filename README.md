# Тестовое задание для фронтенд-разработчика

### DEMO

http://luntegg.ru/projects/leaflet/

### Задача

Сервер с заданной частотой генерирует пакеты данных: пакет текущей локации устройства и пакет текущего статуса устройства. Клиент получает вышеописанные пакеты и обрабатывает их - отображает данные на карте, а также имеет возможность отображать данные в панели в левой части экрана. Устройства на карте необходимо отображать в виде маркеров + попап, всплывающий по клику на маркере и содержащий координаты устройства, его mac-адрес и статус online/offline. В боковой панели фигурирует список устройств, каждый элемент списка содержит координаты устройства, mac и статус.

Серверная часть приложения прилагается - index.js. Необходимо реализовать клиентскую часть.

### Вводные данные

Количество устройств: 20000
Частота генерации пакета локации: 500мс
Частота генерации пакета статуса: 1с

Пакеты данных каждый раз отправляются не для всех устройств, а для рандомного количества.

Формат пакета локации:
```sh
    { mac:DEVICE_MAC,
      type:'location',
      ts:timestamp,
      location:{lon:LON,lat:LAT,alt:ALT}
    }
```

Формат пакета статуса:
```sh
    { mac:DEVICE_MAC,
      type:'status',
      ts:timestamp,
      status:{isOnline:boolean,name:RANDOM_NAME}
    }
```
### Требования
- В качестве библиотеки для карты необходимо использовать Leaflet
- Сервер и клиент обмениваются данными посредством вебсокета
- При подключении клиента к вебсокету сервера необходимо выслать ответ серверу с имененем 'start'
- Используйте кластеризацию маркеров
- Данные устройства в попапах и боковой панели обновляются в режиме реального времени

### Дополнительно
- Рекомендуем использовать пагинацию в боковом меню
- По желанию можно использовать любые библиотеки и фреймворки
- При необходимости количество устройств и частоту отсылки пакетов можно изменять в серверном файле index.js  
