# Controllers (Laravel)

## Prinsip: controller tipis

Controller hanya: terima request → validasi (Form Request) → otorisasi (Policy) → panggil **Action/Service** → kembalikan **API Resource**. Tidak ada query rumit, logika bisnis, atau panggilan MikroTik langsung di controller.

```
app/
├── Http/
│   ├── Controllers/Api/V1/      # DeviceController, SegmentController, IpMapController, ...
│   ├── Controllers/Webhook/     # MikrotikLeaseWebhookController, NetwatchWebhookController
│   ├── Requests/V1/             # StoreDeviceRequest, CheckIpRequest, ...
│   ├── Resources/V1/            # DeviceResource, ConflictEventResource, ...
│   └── Middleware/              # VerifyWebhookSource, EnsureWriteActionsEnabled
├── Actions/                     # satu kelas = satu aksi bisnis
│   ├── Devices/CreateDevice.php
│   ├── IpMap/CheckIpAvailability.php
│   ├── IpMap/SuggestNextFreeIp.php
│   ├── Conflicts/ResolveConflict.php
│   └── Mikrotik/MakeLeaseStatic.php
├── Services/
│   ├── Mikrotik/MikrotikClient.php      # pembungkus REST API RouterOS
│   ├── Mikrotik/Collector.php           # tarik & simpan snapshot
│   ├── Conflicts/RuleEngine.php
│   ├── Cctv/Go2rtcClient.php
│   └── Notifications/TelegramNotifier.php
├── Jobs/                        # SyncMikrotikJob, ScanSegmentJob, PingDevicesJob, EvaluateConflictRulesJob
├── Policies/
└── Enums/
```

## Contoh

```php
final class DeviceController extends Controller
{
    public function index(IndexDeviceRequest $request): AnonymousResourceCollection
    {
        $devices = Device::query()
            ->with(['segment', 'location'])
            ->filter($request->validated())
            ->orderByIp()
            ->paginate($request->integer('per_page', 50));

        return DeviceResource::collection($devices);
    }

    public function store(StoreDeviceRequest $request, CreateDevice $createDevice): DeviceResource
    {
        $this->authorize('create', Device::class);

        $device = $createDevice->handle($request->toData(), $request->user());

        return DeviceResource::make($device)->additional(['message' => 'Perangkat disimpan.']);
    }
}
```

## Aturan

- **Resource controller** (`index/show/store/update/destroy`) bila cocok. Aksi khusus → controller invokable (`MakeLeaseStaticController`) atau method bernama jelas, bukan menumpuk di satu controller.
- Semua controller API di namespace `Api\V1` dan route di `routes/api.php` dengan prefix `v1` + nama route (`v1.devices.index`).
- Validasi **selalu** di Form Request (`rules()`, `messages()` berbahasa Indonesia, `prepareForValidation()` untuk normalisasi MAC/IP).
- Otorisasi lewat Policy (`$this->authorize()`) atau `can:` middleware di route. Jangan cek peran manual dengan `if`.
- Response selalu lewat API Resource. Jangan return model mentah atau array bebas. Format response: [api.md](api.md).
- Error bisnis dilempar sebagai exception domain (`IpAlreadyUsedException`, `MikrotikUnavailableException`) dan dirender di `bootstrap/app.php` → JSON sesuai [api.md](api.md).
- Aksi panjang (scan ARP, sinkron manual) → **dispatch Job**, return `202 Accepted` + id job. Hasil dikirim lewat event Reverb.
- Aksi yang menulis ke MikroTik wajib melewati middleware `EnsureWriteActionsEnabled` + Policy + mencatat `AuditLog` (lihat [security.md](security.md)).
- Webhook controller: hanya validasi & dispatch job, selesai < 100 ms.

## MikrotikClient

- Satu-satunya tempat yang berbicara HTTP ke RouterOS. Pakai `Http::baseUrl()->withBasicAuth()->withOptions(['verify' => $caPath])->timeout(5)->retry(2, 300)`.
- Method bernama sesuai resource: `arp()`, `leases()`, `addresses()`, `pools()`, `routes()`, `bridgeHosts()`, `interfaces()`, `mangle()`; aksi tulis: `makeLeaseStatic()`, `addStaticLease()`, `addArp()`, `blockMac()`, `setPoe()`.
- Mengembalikan DTO / koleksi ter-tipe, bukan array mentah dari RouterOS. Field `kebab-case` RouterOS dipetakan ke `snake_case`.
- Kredensial dibaca dari `settings` terenkripsi, bukan di-hardcode.
- Di test, `MikrotikClient` di-fake (`Http::fake()` dengan fixture JSON di `tests/Fixtures/mikrotik/`).
