<?php
// app/Models/Company.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $table = 'company';

    protected $fillable = [
        'name',
        'logo',
        'phone',
        'email',
        'address',
        'tax_number',
        'invoice_footer'
    ];

    /**
     * Helper Methods
     */
    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo) {
            return null;
        }

        return asset('storage/company/' . $this->logo);
    }

    /**
     * وێنەی پێشگریمان بگەڕێنەوە
     */
    public function getLogoOrDefault(): string
    {
        return $this->logo_url ?? asset('images/default-logo.png');
    }

    /**
     * زانیاری کۆمپانیا وەک array
     */
    public function toInvoiceArray(): array
    {
        return [
            'name' => $this->name,
            'logo' => $this->getLogoOrDefault(),
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'tax_number' => $this->tax_number,
            'invoice_footer' => $this->invoice_footer
        ];
    }

    /**
     * زانیاری کۆمپانیا وەک object
     */
    public static function getSettings()
    {
        return self::first() ?? new self(['name' => 'شوێنی هونەر']);
    }
}
