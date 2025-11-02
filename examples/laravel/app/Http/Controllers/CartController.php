<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CartController extends Controller
{
    public function show(Request $request)
    {
        $uid = optional($request->user())->id ?? 'anon';
        return response()->json(Cache::get("cart_{$uid}", [
            'items' => [], 'totalQty' => 0, 'subtotal' => 0
        ]));
    }

    public function add(Request $request)
    {
        $data = $request->validate([
            'productId' => 'required',
            'qty' => 'nullable|integer|min:1'
        ]);
        $qty = $data['qty'] ?? 1;
        $uid = optional($request->user())->id ?? 'anon';
        $cart = Cache::get("cart_{$uid}", ['items'=>[], 'totalQty'=>0, 'subtotal'=>0]);
        $idx = collect($cart['items'])->search(fn($x) => $x['productId'] == $data['productId']);
        if ($idx !== false) {
            $cart['items'][$idx]['qty'] += $qty;
        } else {
            $cart['items'][] = [
                'key' => (string)$data['productId'],
                'productId' => (string)$data['productId'],
                'title' => 'Item '.$data['productId'],
                'qty' => $qty,
                'unitPrice' => 0,
                'lineTotal' => 0,
            ];
        }
        $cart['totalQty'] = collect($cart['items'])->sum('qty');
        $cart['subtotal'] = collect($cart['items'])->sum(fn($x) => $x['unitPrice'] * $x['qty']);
        Cache::put("cart_{$uid}", $cart, now()->addHours(6));
        return response()->json($cart);
    }
}
