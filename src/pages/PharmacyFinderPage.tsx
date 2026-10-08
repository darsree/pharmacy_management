import React, { useMemo, useState } from 'react';
import {
  Search,
  MapPin,
  Navigation,
  Star,
  Truck,
  Clock3,
  PackageCheck,
  CheckCircle2,
  Crosshair
} from 'lucide-react';

import { usePharmacy } from '../context/PharmacyContext';
import { recommendPharmacies } from '../services/recommendationService';
import { formatCurrency } from '../utils';
import {
  Card,
  CardContent,
  CardHeader
} from '../components/common/Card';
import { Button } from '../components/common/Button';

export const PharmacyFinderPage: React.FC =
  () => {
    const {
      pharmacies,
      pharmacyInventory
    } = usePharmacy();

    const [query, setQuery] =
      useState('');

    const [userLocation, setUserLocation] =
      useState<
        | {
            latitude: number;
            longitude: number;
          }
        | undefined
      >(undefined);

    const [locationStatus, setLocationStatus] =
      useState(
        'Location not used. Results can still be ranked by price, stock and rating.'
      );

    const medicineOptions = useMemo(() => {
      return Array.from(
        new Set(
          pharmacyInventory.flatMap((item) => [
            item.medicineName,
            item.genericName
          ])
        )
      ).filter(Boolean);
    }, [pharmacyInventory]);

    const recommendations = useMemo(
      () =>
        recommendPharmacies(
          query,
          pharmacies,
          pharmacyInventory,
          userLocation
        ),
      [
        query,
        pharmacies,
        pharmacyInventory,
        userLocation
      ]
    );

    const useCurrentLocation = () => {
      if (!navigator.geolocation) {
        setLocationStatus(
          'Geolocation is not supported by this browser.'
        );
        return;
      }

      setLocationStatus(
        'Getting your current location...'
      );

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude:
              position.coords.latitude,
            longitude:
              position.coords.longitude
          });

          setLocationStatus(
            'Location enabled. Pharmacy distance is now included in ranking.'
          );
        },
        () => {
          setLocationStatus(
            'Location permission was denied. Showing recommendations without distance.'
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000
        }
      );
    };

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            Find Best Pharmacy
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Find the best pharmacy for a
            medicine based on price,
            availability, rating, distance
            and delivery.
          </p>
        </div>

        <Card>
          <CardHeader
            title="Search for a medicine"
            subtitle="Compare active pharmacies that currently have stock"
          />

          <CardContent>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  value={query}
                  onChange={(e) =>
                    setQuery(e.target.value)
                  }
                  placeholder="Search medicine, generic name, strength..."
                  list="medicine-options"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <datalist id="medicine-options">
                  {medicineOptions.map(
                    (medicine) => (
                      <option
                        key={medicine}
                        value={medicine}
                      />
                    )
                  )}
                </datalist>
              </div>

              <Button
                variant="outline"
                onClick={
                  useCurrentLocation
                }
                icon={
                  <Crosshair className="w-4 h-4" />
                }
              >
                Use My Location
              </Button>
            </div>

            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Navigation className="w-3 h-3" />
              {locationStatus}
            </div>
          </CardContent>
        </Card>

        {!query.trim() ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">
            Enter a medicine name to see
            pharmacy recommendations.
          </div>
        ) : recommendations.length ===
          0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">
            No active pharmacy currently has
            this medicine in stock.
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations
              .slice(0, 5)
              .map((rec, index) => (
                <Card
                  key={rec.offer.id}
                  className={
                    index === 0
                      ? 'border-emerald-300 ring-1 ring-emerald-100'
                      : ''
                  }
                >
                  <CardContent>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                            #{index + 1}
                          </span>

                          <h3 className="text-sm font-bold text-slate-900">
                            {rec.pharmacy.name}
                          </h3>

                          {index === 0 && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              BEST MATCH
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {rec.pharmacy.address}
                        </p>

                        <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
                          <span className="flex items-center gap-1">
                            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {rec.offer.stock}{' '}
                            in stock
                          </span>

                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            {rec.pharmacy.rating.toFixed(
                              1
                            )}
                            /5
                          </span>

                          <span className="flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-blue-600" />
                            {rec.pharmacy
                              .deliveryAvailable
                              ? 'Delivery'
                              : 'Pickup only'}
                          </span>

                          <span className="flex items-center gap-1">
                            <Clock3 className="w-3.5 h-3.5 text-slate-500" />
                            {rec.pharmacy
                              .open24Hours
                              ? '24 hours'
                              : 'Regular hours'}
                          </span>

                          <span className="flex items-center gap-1">
                            <Navigation className="w-3.5 h-3.5 text-slate-500" />
                            {rec.distanceKm !==
                            undefined
                              ? `${rec.distanceKm.toFixed(
                                  1
                                )} km`
                              : 'Distance unavailable'}
                          </span>
                        </div>

                        <p className="mt-2 text-[11px] text-slate-600">
                          {rec.reasons
                            .slice(0, 4)
                            .join(' • ')}
                        </p>
                      </div>

                      <div className="shrink-0 lg:text-right">
                        <div className="text-[10px] text-slate-400">
                          Medicine price
                        </div>

                        <div className="text-xl font-black text-slate-900">
                          {formatCurrency(
                            rec.offer.price
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500 mt-1">
                          Recommendation score{' '}
                          {rec.score}
                        </div>

                        {rec.pharmacy
                          .deliveryAvailable && (
                          <div className="text-[10px] text-slate-500">
                            Delivery fee{' '}
                            {formatCurrency(
                              rec.pharmacy
                                .deliveryFee,
                              false
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    );
  };