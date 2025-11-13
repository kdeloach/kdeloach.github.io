import React, { useState, useEffect, useRef } from "react";

interface RateState {
    hourly: string;
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
}

interface DiscountState {
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
}

function parseNumber(value: any) {
    return parseFloat(value) || 0;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.round(value));
}

export function PayRateCalculator() {
    const [rates, setRates] = useState<RateState>({
        hourly: "100",
        daily: "760",
        weekly: "3600",
        monthly: "15570",
        yearly: "145600",
    });
    const [discounts, setDiscounts] = useState<DiscountState>({
        daily: "5",
        weekly: "10",
        monthly: "15",
        yearly: "30",
    });
    const [anchor, setAnchor] = useState<keyof RateState>("hourly");

    const hoursPerDay = 8;
    const hoursPerWeek = 40;
    const hoursPerYear = 2080; // implicit holiday/vacation days off with annual salary
    const hoursPerMonth = Math.round(hoursPerYear / 12);
    const daysPerYear = 260; // 365 * 5/7
    const weeksPerYear = 52;
    const monthsPerYear = 12;

    const calculateRates = (rates: RateState, discounts: DiscountState) => {
        let hourly = 0;

        // Convert anchor field to hourly rate
        if (anchor === "hourly") {
            hourly = parseNumber(rates.hourly);
        } else if (anchor === "daily") {
            hourly = parseNumber(rates.daily) / hoursPerDay / (1 - parseNumber(discounts.daily) / 100);
        } else if (anchor === "weekly") {
            hourly = parseNumber(rates.weekly) / hoursPerWeek / (1 - parseNumber(discounts.weekly) / 100);
        } else if (anchor === "monthly") {
            hourly = parseNumber(rates.monthly) / hoursPerMonth / (1 - parseNumber(discounts.monthly) / 100);
        } else if (anchor === "yearly") {
            hourly = parseNumber(rates.yearly) / hoursPerYear / (1 - parseNumber(discounts.yearly) / 100);
        }

        // Calculate rates from hourly
        return {
            hourly: String(Math.round(hourly)),
            daily: String(Math.round(hourly * (1 - parseNumber(discounts.daily) / 100) * hoursPerDay)),
            weekly: String(Math.round(hourly * (1 - parseNumber(discounts.weekly) / 100) * hoursPerWeek)),
            monthly: String(Math.round(hourly * (1 - parseNumber(discounts.monthly) / 100) * hoursPerMonth)),
            yearly: String(Math.round(hourly * (1 - parseNumber(discounts.yearly) / 100) * hoursPerYear)),
        };
    };

    const handleRateChange = (field: keyof RateState, value: string) => {
        const newRates = { ...rates, [field]: value };
        setRates((rates) => calculateRates(newRates, discounts));
    };

    const handleDiscountChange = (field: keyof DiscountState, value: string) => {
        const newDiscounts = { ...discounts, [field]: value };
        setDiscounts(newDiscounts);
        setRates((rates) => calculateRates(rates, newDiscounts));
    };

    const handleFocus = (field: keyof RateState) => {
        setAnchor(field);
    };

    const anchorFieldStyle = "border-blue-500 bg-blue-50";

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto relative overflow-hidden">
                <div className="grid grid-cols-3 gap-4 mb-4 relative z-10">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                value={rates.hourly}
                                onChange={(e) => handleRateChange("hourly", e.target.value)}
                                onFocus={(e) => handleFocus("hourly")}
                                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${anchor === "hourly" ? anchorFieldStyle : ""}`}
                                step="1"
                                min="0"
                            />
                        </div>
                    </div>

                    <div></div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Yearly Equivalent</label>
                        <div className="px-4 py-2.5 text-gray-700 font-medium">{formatCurrency(parseNumber(rates.hourly) * hoursPerYear)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                value={rates.daily}
                                onChange={(e) => handleRateChange("daily", e.target.value)}
                                onFocus={(e) => handleFocus("daily")}
                                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${anchor === "daily" ? anchorFieldStyle : ""}`}
                                step="10"
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Discount %</label>
                        <input type="number" value={discounts.daily} onChange={(e) => handleDiscountChange("daily", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" step="0.1" min="0" max="100" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Yearly Equivalent</label>
                        <div className="px-4 py-2.5 text-gray-700 font-medium">{formatCurrency(parseNumber(rates.daily) * daysPerYear)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Rate</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                value={rates.weekly}
                                onChange={(e) => handleRateChange("weekly", e.target.value)}
                                onFocus={(e) => handleFocus("weekly")}
                                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${anchor === "weekly" ? anchorFieldStyle : ""}`}
                                step="100"
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Discount %</label>
                        <input type="number" value={discounts.weekly} onChange={(e) => handleDiscountChange("weekly", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" step="0.1" min="0" max="100" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Yearly Equivalent</label>
                        <div className="px-4 py-2.5 text-gray-700 font-medium">{formatCurrency(parseNumber(rates.weekly) * weeksPerYear)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rate</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                value={rates.monthly}
                                onChange={(e) => handleRateChange("monthly", e.target.value)}
                                onFocus={(e) => handleFocus("monthly")}
                                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${anchor === "monthly" ? anchorFieldStyle : ""}`}
                                step="500"
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Discount %</label>
                        <input type="number" value={discounts.monthly} onChange={(e) => handleDiscountChange("monthly", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" step="0.1" min="0" max="100" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Yearly Equivalent</label>
                        <div className="px-4 py-2.5 text-gray-700 font-medium">{formatCurrency(parseNumber(rates.monthly) * monthsPerYear)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Yearly Rate</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                value={rates.yearly}
                                onChange={(e) => handleRateChange("yearly", e.target.value)}
                                onFocus={(e) => handleFocus("yearly")}
                                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${anchor === "yearly" ? anchorFieldStyle : ""}`}
                                step="1000"
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Discount %</label>
                        <input type="number" value={discounts.yearly} onChange={(e) => handleDiscountChange("yearly", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" step="0.1" min="0" max="100" />
                    </div>

                    <div></div>
                </div>
            </div>
        </div>
    );
}
